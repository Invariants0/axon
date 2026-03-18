import { evolutionApi } from "@/lib/api-client";

export class EvolutionService {
  static triggerEvolution() {
    return evolutionApi.trigger();
  }

  static getStatus() {
    return evolutionApi.status();
  }

  static getTimeline() {
    return evolutionApi.timeline();
  }
}
