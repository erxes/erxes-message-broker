import tracer from "dd-trace";
import * as formats from "dd-trace/ext/formats";
import debug from "debug";

export const ddLogger = (message, level) => {
  if (!process.env.DD_SERVICE) {
    return debug("erxes-message-broker:")(message);
  }

  const span = tracer.scope().active();
  const time = new Date().toISOString();

  const record = { time, level, message };

  if (span) {
    tracer.inject(span.context(), formats.LOG, record);
  }

  console.log(JSON.stringify(record));
};

export const ddInfo = (message) => {
  return ddLogger(message, "info");
};

export const ddError = (message) => {
  return ddLogger(message, "error");
};
