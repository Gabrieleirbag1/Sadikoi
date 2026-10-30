CURRENT_DIR=$(pwd)

ng build --configuration=production

# French link previews (index.fr.html, served by .htaccess)
node scripts/localize-index.mjs dist/Sadikoi/browser || exit 1

sudo cp .htaccess $CURRENT_DIR/dist/Sadikoi/browser/

sudo cp -r $CURRENT_DIR/dist/Sadikoi/* /var/www/Sadikoi/