import type { DataProvider } from "../types";
import { apiFootballProvider } from "./apiFootball";
import { demoProvider } from "./demo";

export function getProvider(): DataProvider {
  return process.env.API_FOOTBALL_KEY ? apiFootballProvider : demoProvider;
}
