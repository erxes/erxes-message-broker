import * as request from "request-promise";
import { debugBase } from "./debuggers";

let server;
let envs;

const sendRequest = ({ url, method, body }): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reqBody = JSON.stringify(body || {});

    debugBase(`
        Sending request
        url: ${url}
        method: ${method}
        body: ${reqBody}
      `);

    request({
      uri: encodeURI(url),
      method,
      headers: {
        "Content-Type": "application/json",
      },
      ...body,
      json: true,
    })
      .then((res) => {
        debugBase(`
        Success from ${url}
        requestBody: ${reqBody}
        responseBody: ${JSON.stringify(res)}
      `);

        return resolve(res);
      })
      .catch((e) => {
        if (e.code === "ECONNREFUSED") {
          debugBase(`Failed to connect ${url}`);
          throw new Error(`Failed to connect ${url}`);
        } else {
          debugBase(`Error occurred in ${url}: ${e.body}`);
          reject(e);
        }
      });
  });
};

const getUrl = (queueName) => {
  const { MAIN_APP_DOMAIN } = envs;

  if (queueName === "putLog") {
    if (envs.LOGS_API_DOMAIN) {
      return envs.LOGS_API_DOMAIN;
    }

    return "http://127.0.0.1:3800";
  }

  if (queueName === "erxes-api:integrations-notification") {
    if (envs.INTEGRATIONS_API_DOMAIN) {
      return envs.INTEGRATIONS_API_DOMAIN;
    }

    return `${MAIN_APP_DOMAIN}/integrations`;
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
  debugBase(`Adding post for ${queueName}`);

  server.post(`/${queueName}`, async (req, res) => {
    debugBase(`Received data in ${queueName}`);

    const response = await callback(req.body);

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

export const sendMessage = async (queueName, data) => {
  const response = await sendRequest({
    url: `${getUrl(queueName)}/${queueName}`,
    method: "POST",
    body: data,
  });

  return response;
};

export const consumeRPCQueue = consumeQueue;
export const sendRPCMessage = sendMessage;

export const init = async (options: any) => {
  server = options.server;
  envs = options.envs;
};
