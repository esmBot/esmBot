#pragma once

#include <any>
#include <map>
#include <string>

using std::any;
using std::map;
using std::string;

char* Colors(string type, char* BufferData, size_t BufferLength, ArgumentMap Arguments, size_t* DataSize);