module.exports = (config) => {
  const externals = Array.isArray(config.externals) ? [...config.externals] : [config.externals].filter(Boolean);
  externals.push(
    { bcrypt: 'commonjs bcrypt' },
    /^@boilerplate\//, // Externalize all @boilerplate packages
  );
  config.externals = externals;
  return config;
};
