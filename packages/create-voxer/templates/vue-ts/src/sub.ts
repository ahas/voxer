import { Expose, Injectable } from "#app/decorators";

@Injectable()
export class Sub {
    @Expose()
    sub() {
        console.log("this is sub");
    }
}