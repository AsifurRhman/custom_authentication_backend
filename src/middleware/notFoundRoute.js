import httpStatus from "http-status";
import sendError from "../utils/sendError.js";

const notFoundRoute = (req, res) => {
  return sendError(res, httpStatus.NOT_FOUND, {
    message: "API not found!",
    errorSources: [{ path: "API", message: "API not found!" }],
  });
};

export default notFoundRoute;
