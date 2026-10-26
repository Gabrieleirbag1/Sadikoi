CURRENT_DIR=$(pwd)

ng build --configuration=production

sudo cp .htaccess $CURRENT_DIR/dist/Sadikoi/browser/

sudo cp -r $CURRENT_DIR/dist/Sadikoi/* /var/www/Sadikoi/