#include "worker.h"
#include "../common.h"

using namespace std;

ImageAsyncWorker::ImageAsyncWorker(Function& callback, string command, ArgumentMap inArgs, string type, const char *bufData, size_t bufSize)
    : AsyncWorker(callback), command(command), inArgs(inArgs), type(type), bufData(bufData), bufSize(bufSize){}

void ImageAsyncWorker::Execute() {
  outType = GetArgumentWithFallback<bool>(inArgs, "togif", false) ? "gif" : type;
  shouldKill = false;

  if (bufSize != 0) {
    outArgs = FunctionMap.at(command)(type, outType, bufData, bufSize,
                                  inArgs, &shouldKill);
  } else {
    outArgs = NoInputFunctionMap.at(command)(type, outType, inArgs, &shouldKill);
  }
}

void ImageAsyncWorker::OnError(const Error& e) {
  vips_error_clear();
  vips_thread_shutdown();
  if (shouldKill) {
    Callback().Call({Napi::Error::New(Env(), "image_job_killed").Value()});
  } else {
    Callback().Call({e.Value()});
  }
}

void ImageAsyncWorker::OnOK() {
  vips_error_clear();
  vips_thread_shutdown();
  Buffer nodeBuf = Buffer<char>::New(Env(), 0);
  size_t outSize = GetArgument<size_t>(outArgs, "size");
  if (outSize > 0) {
    char* buf = GetArgument<char*>(outArgs, "buf");
    nodeBuf = Buffer<char>::Copy(Env(), buf, outSize);
    g_free(buf);
  }
  Callback().Call({Env().Null(), nodeBuf, String::New(Env(), outType)});
}
