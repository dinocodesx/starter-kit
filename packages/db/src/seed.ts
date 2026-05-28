import { seed } from "./seeds/index";

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
