import { describe, expect, it } from "vitest";
import { calculatePagination, createPaginatedResponse } from "../../src/app/utils/pagination.js";

describe("Pagination Utility Tests", () => {
  it("should calculate correct skip and limit values", () => {
    const result = calculatePagination({ page: 2, limit: 15 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(15);
    expect(result.skip).toBe(15);
    expect(result.sortBy).toBe("createdAt");
    expect(result.sortOrder).toBe("desc");
  });

  it("should sanitize non-alphanumeric sortBy fields", () => {
    const result = calculatePagination({ sortBy: "title; DROP TABLE users;--" });
    expect(result.sortBy).toBe("createdAt");
  });

  it("should generate correct paginated response structure", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const response = createPaginatedResponse(items, 50, 1, 10);

    expect(response.meta).toEqual({
      page: 1,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
    expect(response.items).toEqual(items);
  });
});
