#pragma once

#include <any>
#include <map>
#include <string>

using std::any;
using std::map;
using std::string;

char* Uncaption(string type, char* BufferData, size_t BufferLength, map<string, any> Arguments, size_t* DataSize);