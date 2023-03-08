cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)
cmake_policy(SET CMP0042 NEW)
project(image)

file(GLOB SOURCE_FILES "natives/*.cc" "natives/*.h")

if (CMAKE_JS_VERSION)
  include_directories(${CMAKE_JS_INC})
  add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC} natives/node/image.cc)
  set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
  target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})
else()
  add_executable(${PROJECT_NAME} ${SOURCE_FILES} natives/cli/image.cc)
endif()

target_compile_features(${PROJECT_NAME} PRIVATE cxx_std_17)

if(MSVC) # todo: change flags for more parity with GCC/clang, I don't know much about MSVC so pull requests are open
  set(CMAKE_CXX_FLAGS "/Wall /EHsc /GS")
  set(CMAKE_CXX_FLAGS_DEBUG "/Zi")
  set(CMAKE_CXX_FLAGS_RELEASE "/Ox")
  set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)
  set(BUILD_SHARED_LIBS TRUE)
else()
  set(CMAKE_CXX_FLAGS "-Wall -Wextra -Werror=format-security -Wno-cast-function-type -fexceptions -D_GLIBCXX_ASSERTIONS -fstack-clash-protection -pedantic -D_GLIBCXX_USE_CXX11_ABI=1")
  set(CMAKE_CXX_FLAGS_DEBUG "-g")
  set(CMAKE_CXX_FLAGS_RELEASE "-O2")
endif()

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

find_package(ImageMagick REQUIRED COMPONENTS Magick++ MagickCore)
add_definitions(-DMAGICKCORE_QUANTUM_DEPTH=16)
add_definitions(-DMAGICKCORE_HDRI_ENABLE=0)
include_directories(${ImageMagick_INCLUDE_DIRS})
target_link_libraries(${PROJECT_NAME} ${ImageMagick_LIBRARIES})

pkg_check_modules(VIPS REQUIRED vips-cpp)
include_directories(${VIPS_INCLUDE_DIRS})
link_directories(${VIPS_LIBRARY_DIRS})
target_link_libraries(${PROJECT_NAME} ${VIPS_LDFLAGS})

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET AND CMAKE_JS_VERSION)
  # Generate node.lib
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()
