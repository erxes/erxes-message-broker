import tracer from "dd-trace";
import * as formats from "dd-trace/ext/formats";
import debug from "debug";

export const debugBase = (message) => {
  if (!process.env.DD_SERVICE) {
    return debug("erxes-message-broker:")(message);
  }

  const span = tracer.scope().active();
  const time = new Date().toISOString();

  const record = { time, level: "info", message };

  if (span) {
    tracer.inject(span.context(), formats.LOG, record);
  }

  console.log(JSON.stringify(record));
};
