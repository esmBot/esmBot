#pragma once
#include <napi.h>
#include "../common.h"

using namespace Napi;

class ImageAsyncWorker : public AsyncWorker {
 public:
  ImageAsyncWorker(Function& callback, string command, ArgumentMap inArgs, string type, const char *bufData, size_t bufSize);
  virtual ~ImageAsyncWorker(){};

  void Execute();
  void OnOK();

  private:
    string command;
    ArgumentMap inArgs;
    string type;

    const char *bufData;
    size_t bufSize;

    ArgumentMap outArgs;
    string outType;
    size_t outSize;
};
