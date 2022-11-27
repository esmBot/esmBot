#pragma once

#include <map>
#include <string>
#include <napi.h>

char* CaptionTwo(std::string type, char* BufferData, size_t BufferLength, std::map<std::string, std::string> Arguments, size_t* DataSize);