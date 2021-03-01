import * as cote from "cote";
import { ddError, ddInfo } from "./debuggers";

let publisher;
let subscriber;

let name;

const requesters = {};
const responders = {};

export const consumeQueue = async (queueName: string, callback: any) => {
  if (!subscriber) {
    subscriber = new cote.Subscriber({ name: `${name}Subscriber` });
  }

  subscriber.on(queueName, async (req) => {
    try {
      await callback(JSON.parse(req));
    } catch (e) {
      ddError(`Error occurred during callback ${queueName} ${e.message}`);
    }
  });
};

export const sendRPCMessage = async (
  queueName: string,
  message: any
): Promise<any> => {
  if (!requesters[queueName]) {
    requesters[queueName] = new cote.Requester({
      name: `${queueName} requester`,
      key: queueName,
    });
  }

  ddInfo(
    `Sending rpc message ${JSON.stringify(message)} to queue ${queueName}`
  );

  const response = await requesters[queueName].send({
    type: queueName,
    message: JSON.stringify(message),
  });

  if (response.status === "success") {
    return response.data;
  } else {
    throw new Error(response.errorMessage);
  }
};

export const consumeRPCQueue = async (queueName: string, callback: any) => {
  if (!responders[queueName]) {
    responders[queueName] = new cote.Responder({
      name: `${queueName} responder`,
      key: queueName,
    });
  }

  responders[queueName].on(queueName, async (req: any, cb: any) => {
    try {
      const response = await callback(JSON.parse(req.message));

      cb(null, response);
    } catch (e) {
      ddError(`Error occurred during callback ${queueName} ${e.message}`);
    }
  });
};

export const sendMessage = async (queueName: string, data?: any) => {
  ddInfo(`Sending message to ${queueName}`);

  if (!publisher) {
    publisher = new cote.Publisher({ name: `${name}Publisher` });
  }

  publisher.publish(queueName, Buffer.from(JSON.stringify(data || {})));
};

export const init = async (options: any) => {
  name = options.name;
};
