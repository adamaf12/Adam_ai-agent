import { ProviderRouter } from './modelProviders';
import { ModelGateway } from './modelGateway';

export function createDefaultGateway() {
  const providers = new ProviderRouter();
  const gateway = new ModelGateway((model, request) => providers.invoke(model, request));
  return { gateway, providers };
}
