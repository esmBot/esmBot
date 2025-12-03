#include "../common/argmap.h"
#include "../common/maps.h"
#include "../generic/media.h"
#include <filesystem>
#include <fstream>
#include <iostream>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <vector>

static bool ends_with(std::string_view str, std::string_view suffix) {
  return str.size() >= suffix.size() && str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
}

static bool starts_with(std::string_view str, std::string_view prefix) {
  return str.size() >= prefix.size() && str.compare(0, prefix.size(), prefix) == 0;
}

std::vector<std::string> split(const std::string &s, char delim) {
  std::vector<std::string> result;
  std::stringstream ss(s);
  std::string item;

  while (getline(ss, item, delim)) {
    result.push_back(item);
  }

  return result;
}

struct Args {
  std::vector<std::string> args;
  esmb::ArgumentMap flags;
};

// basically a port of src/utils/parseCommand.ts
Args parseArguments(int argc, char *argv[]) {
  Args args;
  std::optional<std::string> curr;
  std::string concated;

  for (int i = 0; i < argc; i++) {
    const std::string a = argv[i];

    if (starts_with(a, "--") && !curr.has_value()) {
      if (a.find("=") != std::string::npos) {
        std::vector<std::string> separated = split(a.substr(2), '=');
        std::string arg = separated[0];
        std::string value = separated[1];
        bool ended = true;
        if (arg != "args") {
          if (starts_with(value, "\"")) {
            if (ends_with(value, "\"")) {
              args.flags[arg] = value.substr(1, value.size() - 1);
            } else {
              args.flags[arg] = value.substr(1) + " ";
              ended = false;
            }
          } else if (ends_with(value, "\"")) {
            std::string curVal = GetArgument<std::string>(args.flags, arg);
            args.flags[arg] = curVal + a.substr(0, a.size() - 1);
          } else if (value != "") {
            args.flags[arg] = value;
          } else {
            args.flags[arg] = true;
          }

          std::string curVal = GetArgument<std::string>(args.flags, arg);
          if (curVal == "true") {
            args.flags[arg] = true;
          } else if (curVal == "false") {
            args.flags[arg] = false;
          }

          if (!ended) curr = arg;
        }
      } else {
        args.flags[a.substr(2)] = true;
      }
    } else if (curr.has_value()) {
      std::string curVal = GetArgument<std::string>(args.flags, curr.value());
      if (ends_with(a, "\"")) {
        args.flags[curr.value()] = curVal + a.substr(0, a.size() - 1);
        curr = std::nullopt;
      } else {
        args.flags[curr.value()] = curVal + a + " ";
      }
    } else {
      if (concated != "") {
        concated += a + " ";
      } else {
        args.args.push_back(a);
      }
    }
  }

  if (curr.has_value() && GetArgument<std::string>(args.flags, curr.value()) == "") {
    args.flags[curr.value()] = true;
  }

  return args;
}

std::string printHelp() {
  std::stringstream out;
  out << "Usage: esmb-cli function [input] output" << std::endl << std::endl;
  out << "Available functions:" << std::endl;

  bool started = false;
  for (auto cmd : esmb::Image::FunctionMap) {
    if (started) out << ", ";
    out << cmd.first;
    started = true;
  }
  for (auto cmd : esmb::Image::NoInputFunctionMap) {
    if (started) out << ", ";
    out << cmd.first;
    started = true;
  }
  out << std::endl;

  return out.str();
}

int main(int argc, char *argv[]) {
  Args args = parseArguments(argc, argv);

  if (MapContainsKey(args.flags, "version")) {
#ifdef ESMB_VERSION
    std::cout << ESMB_VERSION << std::endl;
#else
    std::cout << esmb_media_version() << std::endl;
#endif
    return 0;
  }

  if (MapContainsKey(args.flags, "help")) {
    std::cout << printHelp();
    return 0;
  }

  if (args.args.size() < 3) {
    std::cerr << printHelp();
    return 1;
  }

  std::string function = args.args[1];
  bool isInputFunc = MapContainsKey(esmb::Image::FunctionMap, function);
  bool isNoInputFunc = MapContainsKey(esmb::Image::NoInputFunctionMap, function);
  if ((!isInputFunc && !isNoInputFunc) || (isInputFunc && args.args.size() < 4)) {
    std::cerr << printHelp();
    return 1;
  }

  if (!MapContainsKey(args.flags, "basePath")) {
    args.flags["basePath"] = std::filesystem::current_path().string() + "/";
  }

  if (MapContainsKey(esmb::Image::FunctionArgsMap, function)) {
    FunctionArgs *funcArgs = esmb::Image::FunctionArgsMap.at(function);
    for (auto arg : *funcArgs) {
      if (!MapContainsKey(args.flags, arg.first)) {
        if (arg.second.required) {
          std::cerr << "Missing required arguments. The following arguments are required for this function: ";
          bool started = false;
          for (auto arg : *funcArgs) {
            if (arg.second.required && arg.first != "basePath") {
              if (started) {
                std::cerr << ", ";
              }
              std::cerr << "--" << arg.first;
              started = true;
            }
          }
          std::cerr << std::endl;
          return 1;
        }
        continue;
      }

      // only check for strings for now, the parser *should* handle bools properly?
      std::string val = GetArgument<std::string>(args.flags, arg.first);
      if (arg.second.type == typeid(int)) {
        try {
          args.flags[arg.first] = std::stoi(val);
        } catch (std::invalid_argument &e) {
          std::cerr << "Invalid integer value passed to " << arg.first << std::endl;
          return 1;
        }
      } else if (arg.second.type == typeid(float)) {
        try {
          args.flags[arg.first] = std::stof(val);
        } catch (std::invalid_argument &e) {
          std::cerr << "Invalid float value passed to " << arg.first << std::endl;
          return 1;
        }
      }
    }
  }

  std::filesystem::path out = isInputFunc ? args.args[3] : args.args[2];

  std::string inType;
  std::vector<char> data;
  if (isInputFunc) {
    std::filesystem::path input = args.args[2];
    // todo: do proper filetype detection
    inType = input.extension().string().substr(1);
    std::ifstream file(input, std::ios::binary);

    size_t size;
    try {
      size = std::filesystem::file_size(input);
    } catch (std::filesystem::filesystem_error &e) {
      std::cerr << e.what() << std::endl;
      return 1;
    }

    data = std::vector<char>(size);
    if (!file.read(data.data(), size)) {
      std::cerr << "Failed to read input" << std::endl;
      return 1;
    }

    file.close();
  }

  std::string outType =
    GetArgumentWithFallback<bool>(args.flags, "togif", false) ? "gif" : out.extension().string().substr(1);

  esmb_media_init();
  esmb_media_result *result =
    esmb_media_process(function.c_str(), args.flags, inType.c_str(), outType.c_str(), data.data(), data.size());

  std::ofstream output(out, std::ios::binary);
  output.write(reinterpret_cast<const char *>(result->buf), result->length);

  esmb_media_free_result(result);
  return 0;
}
