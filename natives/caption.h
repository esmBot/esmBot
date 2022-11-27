#pragma once

#include <map>
#include <string>
#include <napi.h>

char* Caption(std::string type, char* BufferData, size_t BufferLength, std::map<std::string, std::string> Arguments, size_t* DataSize);