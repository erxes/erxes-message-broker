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
    console.log("Using fake ....");
    return fakeClient.init(options);
  }

  if (options.envs.RABBITMQ_HOST) {
    await rabbitmqClient.init(options.envs.RABBITMQ_HOST);

    return rabbitmqClient;
  } else {
    httpClient.init(options);

    return httpClient;
  }
};

export default init;
