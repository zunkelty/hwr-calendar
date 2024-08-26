type NotFoundError = {
  code: "not_found";
  message: string;
};

type InternalError = {
  code: "internal_error";
  message: string;
};

export type Error = NotFoundError | InternalError;

export function handleError(error: Error) {
  console.error("Handling error", error);

  switch (error.code) {
    case "not_found":
      return new Response(error.message, { status: 404 });
    default:
      return new Response("Unknown error", { status: 500 });
  }
}
