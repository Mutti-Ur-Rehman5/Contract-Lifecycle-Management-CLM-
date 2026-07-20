const notificationSocket = (io) => {
  const emitToOrg = (organizationId, event, data) => {
    io.to(`org:${organizationId}`).emit(event, data);
  };

  const emitNotification = (organizationId, notification) => {
    emitToOrg(organizationId, 'notification:new', notification);
  };

  const emitContractStatusChanged = (organizationId, contractData) => {
    emitToOrg(organizationId, 'contract:status_changed', contractData);
  };

  const emitSignatureCompleted = (organizationId, signatureData) => {
    emitToOrg(organizationId, 'signature:completed', signatureData);
  };

  return { emitNotification, emitContractStatusChanged, emitSignatureCompleted };
};

export default notificationSocket;
