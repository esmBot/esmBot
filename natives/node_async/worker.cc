#include "worker.h"
#include "../common.h"

using namespace std;

ImageAsyncWorker::ImageAsyncWorker(Function& callback, string command, ArgumentMap inArgs, string type, const char *bufData, size_t bufSize)
    : AsyncWorker(callback), command(command), inArgs(inArgs), type(type), bufData(bufData), bufSize(bufSize){};

void ImageAsyncWorker::Execute() {
  outType = GetArgumentWithFallback<bool>(inArgs, "togif", false) ? "gif" : type;
  outSize = 0;

  if (bufSize != 0) {
    outArgs = FunctionMap.at(command)(type, outType, bufData, bufSize,
                                  inArgs, outSize);
  } else {
    outArgs = NoInputFunctionMap.at(command)(type, outType, inArgs, outSize);
  }

  vips_error_clear();
  vips_thread_shutdown();
};

void ImageAsyncWorker::OnOK() {
  Buffer nodeBuf = Buffer<char>::New(Env(), 0);
  if (outSize > 0) {
    char* buf = GetArgument<char*>(outArgs, "buf");
    nodeBuf = Buffer<char>::Copy(Env(), buf, outSize);
    g_free(buf);
  }
  Callback().Call({Env().Null(), nodeBuf, String::New(Env(), outType)});
};
