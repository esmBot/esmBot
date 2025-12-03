#pragma once
#include "../common/maps.h"
#include <napi.h>
#include <string>

using namespace Napi;

class MediaAsyncWorker : public AsyncWorker {
public:
  MediaAsyncWorker(Napi::Env &env, Promise::Deferred deferred, std::string command, esmb::ArgumentMap inArgs,
                   std::string type, const char *bufData, size_t bufSize);
  virtual ~MediaAsyncWorker() {};

  void Execute();
  void OnError(const Error &e);
  void OnOK();

  void SetKill() { shouldKill = true; }

private:
  Promise::Deferred deferred;

  std::string command;
  esmb::ArgumentMap inArgs;
  std::string type;

  const char *bufData;
  size_t bufSize;

  CmdOutput outData;
  std::string outType;

  bool shouldKill;
};
