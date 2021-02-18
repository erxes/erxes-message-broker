import * as amqplib from "amqplib";
import { v4 as uuid } from "uuid";
import { debugBase } from "./debuggers";

let channel;
let queuePrefix;

export const consumeQueue = async (queueName, callback) => {
  queueName = queueName.concat(queuePrefix);
  await channel.assertQueue(queueName);

  try {
    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          await callback(JSON.parse(msg.content.toString()), msg);

          channel.ack(msg);
        } catch (e) {
          debugBase(`Error occurred during callback ${queueName} ${e.message}`);
        }
      }
    });
  } catch (e) {
    debugBase(`Error occurred during consumeq queue ${queueName} ${e.message}`);
  }
};

export const consumeRPCQueue = async (queueName, callback) => {
  queueName = queueName.concat(queuePrefix);

  try {
    await channel.assertQueue(queueName);

    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        debugBase(`Received rpc queue message ${msg.content.toString()}`);

        try {
          const response = await callback(JSON.parse(msg.content.toString()));

          channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(response)),
            {
              correlationId: msg.properties.correlationId,
            }
          );

          channel.ack(msg);
        } catch (e) {
          debugBase(`Error occurred during callback ${queueName} ${e.message}`);
        }
      }
    });
  } catch (e) {
    console.log(
      `Error occurred during consume rpc queue ${queueName} ${e.message}`
    );
  }
};

export const sendRPCMessage = async (
  queueName: string,
  message: any
): Promise<any> => {
  queueName = queueName.concat(queuePrefix);

  debugBase(
    `Sending rpc message ${JSON.stringify(message)} to queue ${queueName}`
  );

  const response = await new Promise((resolve, reject) => {
    const correlationId = uuid();

    return channel.assertQueue("", { exclusive: true }).then((q) => {
      channel.consume(
        q.queue,
        (msg) => {
          if (!msg) {
            return reject(new Error("consumer cancelled by rabbitmq"));
          }

          if (msg.properties.correlationId === correlationId) {
            const res = JSON.parse(msg.content.toString());

            if (res.status === "success") {
              resolve(res.data);
            } else {
              reject(new Error(res.errorMessage));
            }

            channel.deleteQueue(q.queue);
          }
        },
        { noAck: true }
      );

      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        correlationId,
        replyTo: q.queue,
      });
    });
  });

  return response;
};

export const sendMessage = async (queueName: string, data?: any) => {
  queueName = queueName.concat(queuePrefix);

  try {
    debugBase(`Sending message to ${queueName}`);

    await channel.assertQueue(queueName);
    await channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(data || {}))
    );
  } catch (e) {
    console.log(`Error occurred during send queue ${queueName} ${e.message}`);
  }
};

export const init = async (RABBITMQ_HOST, prefix) => {
  const connection = await amqplib.connect(RABBITMQ_HOST);

  channel = await connection.createChannel();

  queuePrefix = prefix;
};
