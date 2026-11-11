import http from "k6/http";
import { sleep } from "k6";

const base = __ENV.BASE_URL;
const paths = [
  "/c/holy-church-t",
  "/c/holy-church-t/sermons",
  "/c/holy-church-t/songs",
  "/c/holy-church-t/articles",
  "/c/holy-church-t/events",
  "/c/holy-church-t/sermons/6fecb848-651c-4540-8001-1d40176b388f",
];

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || "20s",
  thresholds: {},
};

export default function () {
  const path = paths[Math.floor(Math.random() * paths.length)];
  http.get(`${base}${path}`, { tags: { page: path } });
  sleep(0.3);
}
