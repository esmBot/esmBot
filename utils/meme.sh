file=$(mktemp /tmp/XXXXXXXXXXXXXXXXXXXXXX.png)
newfile=$(mktemp /tmp/XXXXXXXXXXXXXXXXXXXXXX.png)
newfile2=$(mktemp /tmp/XXXXXXXXXXXXXXXXXXXXXX.png)
convert - -resize 600x600 +profile "*" $file
SIZE=$(identify -format "%[fx:w]" $file)
convert \
  -size $SIZE -background none -gravity center \
  \( \( -font Impact -pointsize 40 pango:"<span foreground='white'>$1</span>" \) \
  \( +clone -channel A -morphology EdgeOut Octagon +channel +level-colors black \) -compose DstOver \) -composite \
  $newfile
if ! [ -z "$2" ]
then
convert \
  -size $SIZE -background none -gravity center \
  \( \( -font Impact -pointsize 40 pango:"<span foreground='white'>$2</span>" \) \
  \( +clone -channel A -morphology EdgeOut Octagon +channel +level-colors black \) -compose DstOver \) -composite \
  $newfile2
convert $file -coalesce null: -gravity north $newfile -layers composite null: -gravity south $newfile2 -layers composite -layers optimize -
exit 0
fi
convert $file -coalesce null: -gravity north $newfile -layers composite -layers optimize -
rm $file
rm $newfile
rm $newfile2