cmake_minimum_required(VERSION 3.19...3.31)
project(esmbmedia)

include(FindPkgConfig)
include(FetchContent)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(SOURCE_FILES natives/common/riff.cc)

set(IMAGE_SOURCE_FILES natives/image/common.cc
  natives/image/blur.cc
  natives/image/bounce.cc
  natives/image/caption.cc
  natives/image/caption2.cc
  natives/image/circle.cc
  natives/image/colors.cc
  natives/image/crop.cc
  natives/image/deepfry.cc
  natives/image/distort.cc
  natives/image/fade.cc
  natives/image/flag.cc
  natives/image/flip.cc
  natives/image/freeze.cc
  natives/image/gamexplain.cc
  natives/image/globe.cc
  natives/image/homebrew.cc
  natives/image/invert.cc
  natives/image/jpeg.cc
  natives/image/meme.cc
  natives/image/mirror.cc
  natives/image/motivate.cc
  natives/image/petpet.cc
  natives/image/reddit.cc
  natives/image/resize.cc
  natives/image/reverse.cc
  natives/image/scott.cc
  natives/image/slide.cc
  natives/image/snapchat.cc
  natives/image/sonic.cc
  natives/image/speed.cc
  natives/image/spin.cc
  natives/image/spotify.cc
  natives/image/squish.cc
  natives/image/swirl.cc
  natives/image/tile.cc
  natives/image/togif.cc
  natives/image/uncanny.cc
  natives/image/uncaption.cc
  natives/image/wall.cc
  natives/image/watermark.cc
  natives/image/whisper.cc)

if (APPLE)
  set(WITH_ZXING_DEFAULT OFF)
else()
  set(WITH_ZXING_DEFAULT ON)
endif()

option(WITH_MAGICK "Build with ImageMagick, enables the magik command" OFF)
option(WITH_ZXING "Build with zxing-cpp, enables the qr command" ${WITH_ZXING_DEFAULT})
option(WITH_BACKWARD "Build with backward-cpp, prints a backtrace on crash/abort" ON)

option(WITH_CLI "Build the CLI interface" OFF)

if (WITH_MAGICK)
  list(APPEND IMAGE_SOURCE_FILES natives/image/magik.cc)
endif()

if (WITH_ZXING)
  list(APPEND IMAGE_SOURCE_FILES natives/image/qr.cc)
endif()

list(APPEND SOURCE_FILES "${IMAGE_SOURCE_FILES}")

if (CMAKE_JS_VERSION)
  add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC} natives/node/media.cc natives/node/worker.cc)
  set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
  target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC})
  target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB})
else()
  add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} natives/generic/media.cc)
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

file(READ "${CMAKE_CURRENT_SOURCE_DIR}/package.json" PACKAGE_JSON)
string(JSON ESMB_VERSION GET "${PACKAGE_JSON}" "version")
add_definitions("-DESMB_VERSION=\"${ESMB_VERSION}\"")

if (NOT CMAKE_JS_VERSION)
  set(CMAKE_POSITION_INDEPENDENT_CODE ON)

  if (WITH_CLI)
    add_executable(esmb-cli natives/cli/cli.cc)
    target_compile_features(esmb-cli PRIVATE cxx_std_17)
    add_dependencies(esmb-cli ${PROJECT_NAME})
    target_link_libraries(esmb-cli PRIVATE ${PROJECT_NAME})

    if (WITH_BACKWARD)
      target_link_libraries(esmb-cli PRIVATE Backward::Interface)
    endif()
  endif()
endif()

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET AND CMAKE_JS_VERSION)
  # Generate node.lib
  execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()
