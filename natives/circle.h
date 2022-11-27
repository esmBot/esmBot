#pragma once

#include "common.h"
#include <map>

using std::map;
using std::string;

char* Circle(string type, char* BufferData, size_t BufferLength, map<string, ARG_TYPES> Arguments, size_t* DataSize);