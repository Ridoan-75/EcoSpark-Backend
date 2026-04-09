type TPaginateOptions = {
  page?: string | number;
  limit?: string | number;
};

type TPaginateResult = {
  skip: number;
  take: number;
  page: number;
  limit: number;
};

const paginate = (options: TPaginateOptions): TPaginateResult => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};

export default paginate;