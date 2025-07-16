import * as readline from "node:readline";

interface ArrayNavigationResult {
  selectedItem: string | undefined;
  selectedIndex: number | undefined;
  cancelled: boolean;
}

export function navigateArray(
  array: string[],
  pageSize = 5,
  originalArray = array,
  originalPageSize = pageSize,
  currentIndex = 0
): Promise<ArrayNavigationResult> {
  return new Promise((resolve) => {
    if (!array || array.length === 0) {
      resolve({
        selectedItem: undefined,
        selectedIndex: undefined,
        cancelled: true,
      });
      return;
    }

    const minifiedPageSize = Math.min(pageSize, array.length);

    const currentPage = array.slice(0, minifiedPageSize);
    currentPage.forEach((element) => console.log(element));

    const onlyPage = !(
      currentIndex + minifiedPageSize < originalArray.length || currentIndex > 0
    );

    if (onlyPage) {
      console.log("(Enter to select page, Esc/Ctrl+C to cancel)");
    } else {
      console.log(
        "(Arrow keys to navigate, Enter to select page, Esc/Ctrl+C to cancel)"
      );
    }

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const cleanup = () => {
      process.stdin.removeListener("keypress", keypressHandler);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    };

    const keypressHandler = (_str: string, key: readline.Key) => {
      if (!key) return;

      // Handle Esc being pressed (aborts navigation)
      if (key.name === "escape" || (key.ctrl && key.name === "c")) {
        cleanup();
        readline.moveCursor(process.stdout, 0, -minifiedPageSize - 1);
        readline.clearScreenDown(process.stdout);
        resolve({
          selectedItem: undefined,
          selectedIndex: undefined,
          cancelled: true,
        });
        return;
      }

      switch (key.name) {
        case "up":
          if (currentIndex <= 0) break;

          cleanup();
          readline.moveCursor(process.stdout, 0, -minifiedPageSize - 1);
          readline.clearScreenDown(process.stdout);

          const previousIndex = Math.max(0, currentIndex - originalPageSize);
          navigateArray(
            originalArray.slice(previousIndex),
            originalPageSize,
            originalArray,
            originalPageSize,
            previousIndex
          ).then(resolve);

          break;

        case "down":
          if (currentIndex + minifiedPageSize < originalArray.length) {
            cleanup();
            readline.moveCursor(process.stdout, 0, -minifiedPageSize - 1);
            readline.clearScreenDown(process.stdout);

            const nextIndex = currentIndex + minifiedPageSize;
            const remainingItems = originalArray.length - nextIndex;
            const nextPageSize = Math.min(originalPageSize, remainingItems);

            navigateArray(
              originalArray.slice(nextIndex),
              nextPageSize,
              originalArray,
              originalPageSize,
              nextIndex
            ).then(resolve);
          }
          break;

        case "return":
          // start in-page nav
          cleanup();
          readline.moveCursor(process.stdout, 0, -minifiedPageSize - 1);
          readline.clearScreenDown(process.stdout);

          inPageNavigation(currentPage, currentIndex, originalArray).then(
            resolve
          );
          break;

        default:
          break;
      }
    };

    process.stdin.on("keypress", keypressHandler);
  });
}

async function inPageNavigation(
  currentPage: string[],
  pageStartIndex: number,
  originalArray: string[],
  selectionIndicator = "*"
): Promise<ArrayNavigationResult> {
  return new Promise((resolve) => {
    let selectedIndex = 0;

    const displayPage = () => {
      currentPage.forEach((item, itemIndex) => {
        console.log(
          item + (itemIndex === selectedIndex ? ` ${selectionIndicator}` : "")
        );
      });
      console.log(
        "(Arrow keys to select, Enter to confirm, Esc/Ctrl+C to cancel)"
      );
    };

    displayPage();

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    const cleanup = () => {
      process.stdin.removeListener("keypress", selectionHandler);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    };

    const selectionHandler = (_str: string, key: readline.Key) => {
      if (!key) return;

      // Handle Esc being pressed (aborts navigation)
      if (key.name === "escape" || (key.ctrl && key.name === "c")) {
        cleanup();
        readline.moveCursor(process.stdout, 0, -currentPage.length - 1);
        readline.clearScreenDown(process.stdout);
        resolve({
          selectedItem: undefined,
          selectedIndex: undefined,
          cancelled: true,
        });
        return;
      }

      switch (key.name) {
        case "up":
          if (selectedIndex <= 0) break;

          selectedIndex--;
          readline.moveCursor(process.stdout, 0, -currentPage.length - 1);
          readline.clearScreenDown(process.stdout);
          displayPage();
          break;

        case "down":
          if (selectedIndex >= currentPage.length - 1) break;

          selectedIndex++;
          readline.moveCursor(process.stdout, 0, -currentPage.length - 1);
          readline.clearScreenDown(process.stdout);
          displayPage();
          break;

        case "return":
          cleanup();
          readline.moveCursor(process.stdout, 0, -currentPage.length - 1);
          readline.clearScreenDown(process.stdout);

          const selectedItem = currentPage[selectedIndex];
          resolve({
            selectedItem,
            selectedIndex,
            cancelled: false,
          });
          break;
      }
    };

    process.stdin.addListener("keypress", selectionHandler);
  });
}
