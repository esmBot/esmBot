#pragma once

#include "common.h"

using std::string;

ArgumentMap Scott(string type, string* outType, char* BufferData, size_t BufferLength,
            ArgumentMap Arguments, size_t* DataSize);