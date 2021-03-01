import * as requestify from "requestify";
import { ddError, ddInfo } from "./debuggers";

let server;
let envs;

const sendRequest = async ({ url, method, body }, wait = false) => {
  ddInfo(`
    Sending request to
    url: ${url}
    method: ${method}
    body: ${JSON.stringify(body)}
  `);

  const reqParams = {
    method,
    headers: { "Content-Type": "application/json" },
    body,
  };

  if (wait) {
    try {
      const response = await requestify.request(url, reqParams);

      const responseBody = response.getBody();

      ddInfo(`
        Success from : ${url}
        responseBody: ${JSON.stringify(responseBody)}
      `);

      return responseBody;
    } catch (e) {
      if (e.code === "ECONNREFUSED" || e.code === "ENOTFOUND") {
        throw new Error(e.message);
      } else {
        const message = e.body || e.message;
        throw new Error(message);
      }
    }
  } else {
    requestify
      .request(url, reqParams)
      .then(() => ddInfo("success"))
      .catch((e) => ddError(e.message));
  }
};

const getUrl = (queueName) => {
  const { MAIN_APP_DOMAIN } = envs;

  if (queueName === "putLog") {
    if (envs.LOGS_API_DOMAIN) {
      return envs.LOGS_API_DOMAIN;
    }

    return "http://127.0.0.1:3800";
  }

  if (
    queueName === "erxes-api:integrations-notification" ||
    queueName === "rpc_queue:api_to_integrations"
  ) {
    if (envs.INTEGRATIONS_API_DOMAIN) {
      return envs.INTEGRATIONS_API_DOMAIN;
    }

    return `${MAIN_APP_DOMAIN}/integrations`;
  }

  // from engages to erxes-api
  if (queueName === "engagesNotification") {
    return envs.MAIN_API_DOMAIN;
  }

  if (queueName === "rpc_queue:integrations_to_api") {
    return envs.MAIN_API_DOMAIN;
  }

  if (queueName === "erxes-api:engages-notification") {
    if (envs.ENGAGES_API_DOMAIN) {
      return envs.ENGAGES_API_DOMAIN;
    }

    return "http://127.0.0.1:3900";
  }

  if (queueName === "rpc_queue:api_to_workers") {
    if (envs.WORKERS_API_DOMAIN) {
      return envs.WORKERS_API_DOMAIN;
    }

    return "http://127.0.0.1:3700";
  }
};

export const consumeQueue = (queueName, callback) => {
  ddInfo(`Adding post for ${queueName}`);

  server.post(`/${queueName}`, async (req, res) => {
    ddInfo(`Received data in ${queueName}`);

    let response;

    try {
      response = await callback(req.body);
    } catch (e) {
      const errorMessage = `Error occurred during callback ${queueName} ${e.message}`;

      ddError(errorMessage);

      return res.status(500).send(errorMessage);
    }

    if (!response) {
      return res.send("ok");
    }

    if (response.status === "success") {
      return res.json(response.data);
    } else {
      return res.status(500).send(response.errorMessage);
    }
  });
};

export const sendMessage = async (queueName, data, wait = false) => {
  const response = await sendRequest(
    {
      url: `${getUrl(queueName)}/${queueName}`,
      method: "POST",
      body: data,
    },
    wait
  );

  return response;
};

export const consumeRPCQueue = consumeQueue;

export const sendRPCMessage = (queueName, data) => {
  return sendMessage(queueName, data, true);
};

export const init = async (options: any) => {
  server = options.server;
  envs = options.envs;
};
