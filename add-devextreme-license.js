const { exec } = require('child_process');

// Reemplaza 'your-license-key' con tu clave de licencia proporcionada por DevExpress
const licenseKey = 'ewogICJmb3JtYXQiOiAxLAogICJjdXN0b21lcklkIjogImEwODE3YzBkLTNmNzYtNDJjYS1hZDE5LTllYmMyYzVmMWI5ZSIsCiAgIm1heFZlcnNpb25BbGxvd2VkIjogMjQxCn0=.jDVYl8D2frZn/DKgp33IHvycOBynlH7eg3YIyIo4TFkrIsKibx4k5SKn0UGtuM6pUwB+ZaG+v/qxpM20xJN8PNfFqZAd5oX6ZnRHVjGWrSy/8lRcq+6WwmuHDNwRU22lnRi/lQ==';

// Comando para registrar la licencia de DevExtreme
const command = `npx devextreme register ${licenseKey}`;

exec(command, (err, stdout, stderr) => {
  if (err) {
    console.error(`Error al registrar la licencia de DevExtreme: ${stderr}`);
    process.exit(1); // Termina el proceso si hay un error
  } else {
    console.log(`Licencia de DevExtreme registrada exitosamente: ${stdout}`);
  }
});