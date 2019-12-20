newfile=$(mktemp /tmp/XXXXXXXXXXXXXXXXXXXXXX.png)
convert - -resize 600x600 +profile "*" $newfile
SIZE=$(identify -format "%[fx:w]x%[fx:h]" $newfile)
convert $newfile \
  -gravity north \
  \( -size $SIZE -background none -font "./assets/ImpactMix.ttf" -pointsize 50 -stroke black -strokewidth 3 caption:"$1" \) -composite \
  \( -size $SIZE -background none -font "./assets/ImpactMix.ttf" -pointsize 50 -fill white -stroke none caption:"$1" \) -composite \
  -gravity south \
  \( -size $SIZE -background none -font "./assets/ImpactMix.ttf" -pointsize 50 -stroke black -strokewidth 3 caption:"$2" \) -composite \
  \( -size $SIZE -background none -font "./assets/ImpactMix.ttf" -pointsize 50 -fill white -stroke none caption:"$2" \) -composite\
  -
rm $newfile
