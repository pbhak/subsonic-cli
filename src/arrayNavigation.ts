import * as readline from "node:readline";

export function navigateArray(array: string[], pageSize = 5) {
  if (array.length < pageSize || array.length < 1) process.exit();

  array.slice(0, pageSize).forEach((element) => {
    console.log(element);
  });
  if (array.length !== pageSize) {
    console.log("(use arrow keys to navigate)");
  } else {
    console.log("(end of list)");
  }

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  const keypressHandler = (_str: string, key: readline.Key) => {
    if (key && key.ctrl && key.name === "c") {
      console.log("Ctrl+C pressed - exiting...");
      process.exit();
    }

    switch (key.name) {
      case "up":
        // Up arrow pressed
        break;
      case "down":
        readline.moveCursor(process.stdout, 0, -pageSize - 1);
        readline.clearScreenDown(process.stdout);
        if (array.slice(pageSize).length < pageSize) {
          process.stdin.removeListener("keypress", keypressHandler);
          navigateArray(array.slice(pageSize), array.slice(pageSize).length);
          break;
        }
        process.stdin.removeListener("keypress", keypressHandler);
        navigateArray(array.slice(pageSize), pageSize);
        break;
      default:
        break;
    }
  };

  process.stdin.on("keypress", keypressHandler);
}

navigateArray(
  [
    "apple",
    "river",
    "cloud",
    "stone",
    "flame",
    "mouse",
    "leaf",
    "star",
    "book",
    "drift",
  ],
  4 
);
