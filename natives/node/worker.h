#pragma once
#include "../common.h"
#include <napi.h>

using namespace Napi;

class ImageAsyncWorker : public AsyncWorker {
public:
  ImageAsyncWorker(Napi::Env &env, Promise::Deferred deferred, string command, ArgumentMap inArgs, string type,
                   const char *bufData, size_t bufSize);
  virtual ~ImageAsyncWorker() {};

  void Execute();
  void OnError(const Error &e);
  void OnOK();

  void SetKill() { shouldKill = true; }

private:
  Promise::Deferred deferred;

  string command;
  ArgumentMap inArgs;
  string type;

  const char *bufData;
  size_t bufSize;

  ArgumentMap outArgs;
  string outType;

  bool shouldKill;
};
