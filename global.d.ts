import 'sequelize';
type M = (new (...args: any[]) => import('sequelize').Model) 
       & typeof import('sequelize').Model;
declare global {
  type SeqModels = import('sequelize').Sequelize['models'] & {
    Course: M;
    Chapter: M;
    Category: M;
    User: M;
    Article: M;
    Like: M;
    Setting: M;    
    Index: M;
  };
}