# readme.md
This very simple Chrome extension removes negative user reviews in any Metacritic user reviews page and returns an estimate "debombed" score. It is shown next to the original scores distribution card so you can easily see the difference.

## How to install
Just download the project, go to the jigsaw (extensions) button, go to "manage extensions" and use "load uncompressed".

## Notes
The debombing calculation just assumes an even distribution of negative scores (0-4). We cannot get the exact distribution of negative scores as it would require scrapping or other moves that would be against Metacritic's TOS. A perfectly debombed score would usually show a higher score because reviewbombers usually go for a 0 or 1 out of 10 and not 2-4, but I don't know how could I refine that.
