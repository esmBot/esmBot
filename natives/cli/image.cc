#include <cstring>
#include <iostream>

#include "../common.h"

void showUsage(char *path) {
	std::cout << "Usage: " << path << " operation [--arg=\"param\"] [...]" << std::endl;
}

int main(int argc, char *argv[]) {
  if (argc < 1 ||
      (argc == 1 && !strcmp(argv[1], "-h"))) {
    showUsage(argv[0]);
#ifdef _WIN32
    system("PAUSE");
#endif
    return 1;
  }

  char *op = argv[1];

  //handleArguments(argc, argv);

  std::cout << "This does nothing yet, but it might in the future!" << std::endl;
  return 0;
}