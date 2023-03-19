#pragma once

#include "common.h"

using std::string;

ArgumentMap Wall(string type, string* outType, char* BufferData, size_t BufferLength,
           ArgumentMap Arguments, size_t* DataSize);