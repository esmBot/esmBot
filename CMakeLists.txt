cmake_minimum_required(VERSION 3.15...3.31)
project(image)

include(FindPkgConfig)
include(FetchContent)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(SOURCE_FILES natives/blur.cc
  natives/bounce.cc
  natives/caption.cc
  natives/caption2.cc
  natives/circle.cc
  natives/colors.cc
  natives/commands.h
  natives/common.cc
  natives/common.h
  natives/crop.cc
  natives/deepfry.cc
  natives/distort.cc
  natives/fade.cc
  natives/flag.cc
  natives/flip.cc
  natives/freeze.cc
  natives/gamexplain.cc
  natives/globe.cc
  natives/homebrew.cc
  natives/invert.cc
  natives/jpeg.cc
  natives/meme.cc
  natives/mirror.cc
  natives/motivate.cc
  natives/reddit.cc
  natives/resize.cc
  natives/reverse.cc
  natives/scott.cc
  natives/snapchat.cc
  natives/sonic.cc
  natives/speed.cc
  natives/spin.cc
  natives/spotify.cc
  natives/squish.cc
  natives/swirl.cc
  natives/tile.cc
  natives/togif.cc
  natives/uncanny.cc
  natives/uncaption.cc
  natives/watermark.cc
  natives/whisper.cc)

if (APPLE)
  set(WITH_ZXING_DEFAULT OFF)
else()
  set(WITH_ZXING_DEFAULT ON)
endif()

option(WITH_MAGICK "Build with ImageMagick, enables the magik and wall commands" OFF)
option(WITH_ZXING "Build with zxing-cpp, enables the qr command" ${WITH_ZXING_DEFAULT})
option(WITH_BACKWARD "Build with backward-cpp, prints a backtrace on crash/abort" ON)

if (WITH_MAGICK)
  list(APPEND SOURCE_FILES natives/magik.cc
    natives/wall.cc)
endif()

if (WITH_ZXING)
  list(APPEND SOURCE_FILES natives/qr.cc)
endif()

if (CMAKE_JS_VERSION)
  add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC} natives/node/image.cc natives/node/worker.cc)
  set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
  target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC})
  target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB})
else()
  add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} natives/generic/image.cc)
endif()

target_compile_features(${PROJECT_NAME} PRIVATE cxx_std_17)

if(MSVC) # todo: change flags for more parity with GCC/clang, I don't know much about MSVC so pull requests are open
  set(CMAKE_CXX_FLAGS "/Wall /EHsc /GS")
  set(CMAKE_CXX_FLAGS_DEBUG "/Zi")
  set(CMAKE_CXX_FLAGS_RELEASE "/Ox")
  set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)
  set(BUILD_SHARED_LIBS TRUE)
else()
  set(CMAKE_CXX_FLAGS "-Wall -Wextra -Werror=format-security -Wno-cast-function-type -fexceptions -D_GLIBCXX_ASSERTIONS -fstack-clash-protection -pedantic")
  set(CMAKE_CXX_FLAGS_DEBUG "-g")
  set(CMAKE_CXX_FLAGS_RELEASE "-O2")
endif()

if (WITH_MAGICK)
  find_package(ImageMagick COMPONENTS Magick++ MagickCore)
  if (ImageMagick_FOUND)
    add_definitions(-DMAGICK_ENABLED)
    add_definitions(-DMAGICKCORE_QUANTUM_DEPTH=16)
    add_definitions(-DMAGICKCORE_HDRI_ENABLE=0)
    include_directories(${ImageMagick_INCLUDE_DIRS})
    target_link_libraries(${PROJECT_NAME} ${ImageMagick_LIBRARIES})
  endif()
endif()

if (WITH_ZXING)
  find_package(ZXing)
  if (ZXing_FOUND)
    add_definitions(-DZXING_ENABLED)
    target_link_libraries(${PROJECT_NAME} ZXing::ZXing)
  endif()
endif()

if (WITH_BACKWARD)
  FetchContent_Declare(backward GIT_REPOSITORY https://github.com/bombela/backward-cpp)
  FetchContent_MakeAvailable(backward)
  add_definitions(-DWITH_BACKWARD)
  target_link_libraries(${PROJECT_NAME} Backward::Interface)
endif()

find_package(Fontconfig REQUIRED)
include_directories(${Fontconfig_INCLUDE_DIRS})
target_link_libraries(${PROJECT_NAME} ${Fontconfig_LIBRARIES})

pkg_check_modules(VIPS REQUIRED vips-cpp)
include_directories(${VIPS_INCLUDE_DIRS})
link_directories(${VIPS_LIBRARY_DIRS})
target_link_libraries(${PROJECT_NAME} ${VIPS_LDFLAGS})

if (NOT CMAKE_JS_VERSION)
  set(CMAKE_POSITION_INDEPENDENT_CODE ON)
  FetchContent_Declare(
    simdjson
    GIT_REPOSITORY https://github.com/simdjson/simdjson.git
    GIT_TAG  tags/v3.13.0
    GIT_SHALLOW TRUE)
  FetchContent_MakeAvailable(simdjson)
  target_link_libraries(${PROJECT_NAME} simdjson)
endif()

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET AND CMAKE_JS_VERSION)
  # Generate node.lib
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()
