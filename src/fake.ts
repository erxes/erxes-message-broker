import { debugBase } from "./debuggers";

let server;
let envs;

export const consumeQueue = (queueName) => {
  debugBase(`Adding post for ${queueName}`);
};

export const sendMessage = async (queueName) => {
  debugBase(`Sent message to ${queueName}`);
};

export const consumeRPCQueue = consumeQueue;

export const sendRPCMessage = (queueName) => {
  return sendMessage(queueName);
};

export const init = async (options: any) => {
  server = options.server;
  envs = options.envs;
};
