import * as httpClient from "./http";
import * as fakeClient from "./fake";
import * as rabbitmqClient from "./rabbitmq";

interface IOptions {
  name: string;
  server?: any;
  envs?: { [key: string]: string };
}

const init = async (options: IOptions) => {
  if (options.envs.NODE_ENV === "test") {
    fakeClient.init(options);

    return fakeClient;
  }

  if (options.envs.RABBITMQ_HOST) {
    await rabbitmqClient.init(
      options.envs.RABBITMQ_HOST,
      options.envs.MESSAGE_BROKER_PREFIX || ""
    );

    return rabbitmqClient;
  } else {
    httpClient.init(options);

    return httpClient;
  }
};

export default init;
