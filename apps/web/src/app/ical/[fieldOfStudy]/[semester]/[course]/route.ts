import { config } from "@repo/config";
import { NextRequest } from "next/server";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { findCalendar } from "../../../../../util/find-calendar";
import { handleError } from "../../../../../errors";

const ParamsSchema = z.object({
  fieldOfStudy: z.string(),
  course: z.string(),
  semester: z.string(),
});

type Params = z.infer<typeof ParamsSchema>;

const QueryOptions = z.object({
  options: z
    .string()
    .transform((val, ctx) => {
      const split = val.split(",");

      if (split.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "No valid options provided",
        });
      }

      return split;
    })
    .nullable()
    .optional(),
});

export const GET = async (req: NextRequest, props: { params: Params }) => {
  const params = ParamsSchema.safeParse(props.params);

  if (!params.success) {
    const validationError = fromError(params.error);

    return new Response(`Invalid search params: ${validationError.message}`, {
      status: 400,
    });
  }

  const query = QueryOptions.safeParse({
    options: req.nextUrl.searchParams.get("options"),
  });

  if (!query.success) {
    const validationError = fromError(query.error);

    return new Response(`Invalid query params: ${validationError.message}`, {
      status: 400,
    });
  }

  // 1. Find calendar

  const calendar = findCalendar({
    availableCourses: config().courses,
    ...params.data,
  });

  if (calendar.isErr) {
    return handleError(calendar.error);
  }

  // 2. Retrieve existing calendar from database
};
