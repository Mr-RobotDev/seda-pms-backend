interface PopulateOption {
  path: string;
  select?: string;
  match?: object;
  populate?: PopulateOption;
}

export interface Options {
  page?: number;
  limit?: number;
  sortBy?: string;
  projection?: string;
  populate?: PopulateOption[];
}
