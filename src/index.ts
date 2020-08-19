import * as httpClient from "./http";
import * as rabbitmqClient from "./rabbitmq";

interface IOptions {
  name: string;
  server?: any;
  envs?: { [key: string]: string };
}

const init = async (options: IOptions) => {
  if (options.envs.RABBITMQ_HOST) {
    await rabbitmqClient.init(options.envs.RABBITMQ_HOST);

    return rabbitmqClient;
  } else {
    httpClient.init(options);

    return httpClient;
  }
};

export default init;
