import mongoose from "mongoose";

class APIFeatures {
  constructor(query, queryString, isAggregation = false) {
    this.query = query;
    this.queryString = queryString;
    this.isAggregation = isAggregation;
    this.pipeline = isAggregation ? query.pipeline() : [];
    this.filterConditions = {};
    this.searchConditions = [];
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "search",
      "searchFields",
    ];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    const conditions = JSON.parse(queryStr);

    for (const key in conditions) {
      if (Array.isArray(this.filterConditions[key])) {
        this.filterConditions[key].push(conditions[key]);
      } else if (this.filterConditions[key]) {
        this.filterConditions[key] = [
          this.filterConditions[key],
          conditions[key],
        ];
      } else {
        this.filterConditions[key] =
          key === "_id"
            ? new mongoose.Types.ObjectId(conditions[key])
            : conditions[key];
      }
    }

    for (const key in this.filterConditions) {
      if (Array.isArray(this.filterConditions[key])) {
        this.filterConditions[key] = { $in: this.filterConditions[key] };
      }
    }

    if (this.isAggregation) {
      this.pipeline.push({ $match: this.filterConditions });
    } else {
      this.query = this.query.find(this.filterConditions);
    }

    return this;
  }

  search() {
    if (this.queryString.search && this.queryString.searchFields) {
      const searchValue = this.queryString.search;
      const fields = this.queryString.searchFields.split(",");
      const regex = new RegExp(searchValue, "i");
      this.searchConditions = fields.map((field) => ({
        [field.trim()]: regex,
      }));
      const hasNestedFields = fields.some((field) => field.includes("."));

      if (this.isAggregation) {
        this.pipeline.push({ $match: { $or: this.searchConditions } });
      } else {
        if (hasNestedFields) {
          throw new Error("Nested search field not allowed");
        }
        this.query = this.query.find({ $or: this.searchConditions });
      }
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort
        .split(",")
        .map((field) =>
          field.startsWith("-") ? [field.slice(1), -1] : [field, 1]
        );
      const sortObject = Object.fromEntries(sortBy);

      if (this.isAggregation) {
        this.pipeline.push({ $sort: sortObject });
      } else {
        this.query = this.query.sort(sortObject);
      }
    } else {
      if (this.isAggregation) {
        this.pipeline.push({ $sort: { createdAt: -1 } });
      } else {
        this.query = this.query.sort("-createdAt");
      }
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      if (this.isAggregation) {
        this.pipeline.push({ $project: this.parseFields(fields) });
      } else {
        this.query = this.query.select(fields);
      }
    } else {
      if (this.isAggregation) {
        this.pipeline.push({ $project: { __v: 0 } });
      } else {
        this.query = this.query.select("-__v");
      }
    }

    return this;
  }

  parseFields(fields) {
    const fieldArray = fields.split(" ");
    const projection = {};
    fieldArray.forEach((field) => {
      projection[field] = 1;
    });
    return projection;
  }

  async paginate(Model) {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;

    if (this.isAggregation) {
      const countPipeline = [...this.pipeline, { $count: "total" }];

      this.pipeline.push({ $skip: skip });
      this.pipeline.push({ $limit: limit });

      const data = await this.query.exec();
      const totalDocuments = await Model.aggregate(countPipeline).then(
        (result) => (result[0] ? result[0].total : 0)
      );
      const totalPages = Math.ceil(totalDocuments / limit);

      return {
        data,
        totalDocuments,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } else {
      this.query = this.query.skip(skip).limit(limit);
      const data = await this.query.exec();

      const totalConditions = {
        ...this.filterConditions,
        ...(this.searchConditions.length > 0
          ? { $or: this.searchConditions }
          : {}),
        ...this.query.getQuery(),
      };
      const totalDocuments = await Model.countDocuments(totalConditions);
      const totalPages = Math.ceil(totalDocuments / limit);

      return {
        data,
        totalDocuments,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }
  }
}

export { APIFeatures };
