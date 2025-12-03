#include "worker.h"
#include "../image/common.h"

using namespace std;

ImageAsyncWorker::ImageAsyncWorker(Napi::Env &env, Promise::Deferred deferred, string command, esmb::ArgumentMap inArgs,
                                   string type, const char *bufData, size_t bufSize)
    : AsyncWorker(env), deferred(deferred), command(command), inArgs(inArgs), type(type), bufData(bufData),
      bufSize(bufSize) {}

void ImageAsyncWorker::Execute() {
  outType = GetArgumentWithFallback<bool>(inArgs, "togif", false) ? "gif" : type;
  shouldKill = false;

  if (bufSize != 0) {
    outData = esmb::Image::FunctionMap.at(command)(type, outType, bufData, bufSize, inArgs, &shouldKill);
  } else {
    outData = esmb::Image::NoInputFunctionMap.at(command)(type, outType, inArgs, &shouldKill);
  }
}

void ImageAsyncWorker::OnError(const Error &e) {
  vips_error_clear();
  vips_thread_shutdown();
  if (shouldKill) {
    deferred.Reject(Napi::Error::New(Env(), "media_job_killed").Value());
  } else {
    deferred.Reject(e.Value());
  }
}

void ImageAsyncWorker::OnOK() {
  vips_error_clear();
  vips_thread_shutdown();
  Buffer nodeBuf = Buffer<char>::New(Env(), outData.buf, outData.length,
                                     []([[maybe_unused]] Napi::Env env, char *data) { free(data); });

  Napi::Object returned = Napi::Object::New(Env());
  returned.Set("data", nodeBuf);
  returned.Set("type", Napi::String::New(Env(), outType));
  deferred.Resolve(returned);
}
